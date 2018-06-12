import axios, { AxiosInstance, AxiosRequestConfig, AxiosPromise, AxiosResponse } from 'axios';
import {
  camelizeKeys,
  decamelizeKeys,
} from 'humps';
import {
  map,
  has,
  merge,
  pick,
} from 'ramda';
import { STATUS_CODES } from 'http';

import Endpoint from './Endpoint';
import { Nullable } from 'types';

class API {
  // Endpoints passed will be registered here
  public $: any = {};
  private axios: AxiosInstance;

  constructor(baseUrl: string, endpoints: Endpoint[]) {
    this.axios = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    this.registerEndPoints(endpoints);
  }

  static interceptors = {
    formatResponseToCamelCase(response: AxiosResponse) {
      const contentType = response.headers['content-type'];

      if (contentType && contentType.indexOf('application/json') > -1) {
        return merge(
          response,
          { data: camelizeKeys(response.data) },
        );
      }

      return response;
    },
  }

  public intercept(
    type: 'request',
    onFulfilled: (value: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
    onRejected?: (error: any) => any,
  ): void;

  public intercept(
    type: 'response',
    onFulfilled: (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: any) => any,
  ): void;

  public intercept(
    type: any,
    onFulfilled: any,
    onRejected?: any,
  ) {
    if (type === 'request') {
      this.axios.interceptors.request.use(
        onFulfilled,
        onRejected,
      );

      return;
    }

    this.axios.interceptors.response.use(
      onFulfilled,
      onRejected,
    );
  }

  public addEndpoint(instance: Endpoint) {
    const groupName = instance.group();
    const endpointName = instance.name();

    // if we don't have yet this group, we created it as an empty object
    if (!has(groupName, this.$)) {
      this.$[groupName] = {};
    }

    if (has(endpointName, this.$[groupName])) {
      throw new Error(`Endpoint ${groupName}.${endpointName} already defined.`);
    }

    // register the endpoint and bind the instance the function call to this class,
    // so the http methods will be available there
    this.$[groupName][endpointName] = instance.call.bind(this);
  }

  public registerEndPoints(endpoints: Endpoint[]) {
    map(endpoint => this.addEndpoint(endpoint), endpoints);
  }

  public request(
    {
      url,
      method,
      headers,
      data,
    }: AxiosRequestConfig,
    convertBodyToSnakeCase = false,
  ) {
    const options: AxiosRequestConfig = {
      url,
      method,
      headers,
    };

    if (data) {
      options.data = convertBodyToSnakeCase ? decamelizeKeys(data) : data;
    }

    return this.axios.request(options);
  }

  // HTTP methods
  public get = (options: AxiosRequestConfig) => this.request({ method: 'GET', ...options });
  public delete = (options: AxiosRequestConfig) => this.request({ method: 'DELETE', ...options });

  public post = (options: AxiosRequestConfig, data: any, convertBodyToSnakeCase: Nullable<boolean>) =>
    this.request({ method: 'POST', data, ...options }, !!convertBodyToSnakeCase);

  public put = (options: AxiosRequestConfig, data: any, convertBodyToSnakeCase: Nullable<boolean>) =>
    this.request({ method: 'PUT', data, ...options }, !!convertBodyToSnakeCase);

  public patch = (options: AxiosRequestConfig, data: any, convertBodyToSnakeCase: Nullable<boolean>) =>
    this.request({ method: 'PATCH', data, ...options }, !!convertBodyToSnakeCase);
}

export default API;

