/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
import { intersection, isEmpty } from 'ramda';
import { SchemaDirectiveVisitor } from 'apollo-server';
import { defaultFieldResolver } from 'graphql';

class AuthDirective extends SchemaDirectiveVisitor {
    visitObject(type) {
        this.ensureFieldsWrapped(type);
        type._requiredAuthRole = this.args.requires;
    }

    // Visitor methods for nested types like fields and arguments
    // also receive a details object that provides information about
    // the parent and grandparent types.
    visitFieldDefinition(field, details) {
        this.ensureFieldsWrapped(details.objectType);
        field._requiredAuthRole = this.args.requires;
    }

    ensureFieldsWrapped(objectType) {
        // Mark the GraphQLObjectType object to avoid re-wrapping:
        if (objectType._authFieldsWrapped) return;
        objectType._authFieldsWrapped = true;

        const fields = objectType.getFields();

        Object.keys(fields).forEach((fieldName) => {
            const field = fields[fieldName];
            const { resolve = defaultFieldResolver } = field;
            field.resolve = async (...args) => {
                // Get the required Role from the field first, falling back
                // to the objectType if no Role is required by the field:
                const requiredRole = field._requiredAuthRole || objectType._requiredAuthRole;
                if (!requiredRole) {
                    return resolve.apply(this, args);
                }
                const context = args[2];
                const userId = context.me.username;
                const user = await context.loaders.user.load(userId);

                if (isEmpty(intersection(user.role, requiredRole))) {
                    throw new Error('Not authorized');
                }
                const data = await resolve.apply(this, args);
                return data;
            };
        });
    }
}

export default AuthDirective;
