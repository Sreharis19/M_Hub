/* eslint-disable import/prefer-default-export */
import { gql } from '@apollo/client/core';

export const CREATE_NOTIFICATION = gql`
    mutation createNotification($notification: notificationInput) {
        createNotification(notification: $notification) {
            _id
        }
    }
`;
