/* eslint-disable import/prefer-default-export */
import fetch from 'node-fetch';

export const getProgramData = async (data) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getPrograms`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(data),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getOrganizationData = async (data) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getOrganizations`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(data),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getCurrentUser = async (token) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/me`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `bearer ${token}`,
        },
        method: 'POST',
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getAccessiblePrograms = async (body) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getAccessiblePrograms`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getAccessibleOrganizations = async (body) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getAccessibleOrganizations`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getAllMenteesInAProgram = async (body) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getAllMenteesInAProgram`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const setActiveCurriculum = async (body) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/setActiveCurriculum`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getUserDetail = async (body) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getUserDetail`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getUsers = async (body) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getUsers`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};

export const getEmails = async (body) => {
    const rawResponse = await fetch(`${process.env.USER_URL}/serviceData/getEmails`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'mh-token': process.env.SERVICE_TOKEN,
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    const response = await rawResponse.json();
    if (response.error) throw response.error;
    return response;
};
