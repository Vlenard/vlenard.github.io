const baseURL = "https://iit-playground.arondev.hu/api/FJYXPC/";

/**
 * @param {RequestInfo | URL} url 
 * @param {RequestInit} params 
 * @returns {Promise<Response>}
 */
const api = (url, params) => fetch(baseURL + url, {});