import fetch from 'isomorphic-fetch';
import {
  camelizeKeys,
  decamelizeKeys,
} from 'humps';
import {
  forEach,
  has,
} from 'ramda';

import Endpoint from './Endpoint';
import { RequestInitWithUrl } from './types';

class API {
  // Endpoints available through the /endpoints folder will be registered here
  private $: any = {};

  constructor(private baseUrl: string, endpoints: Endpoint[]) {
    this.registerEndPoints(endpoints);
  }

  addEndpoint(instance: Endpoint) {
    if (!(instance instanceof Endpoint)) {
      throw new TypeError('Expected instance of Endpoint as parameter');
    }

    const groupName = instance.group();
    const endpointName = instance.name();

    // if we don't have yet this group, we created it as an empty object
    if (!has(groupName, this.$)) {
      this.$[groupName] = {};
    }

    // If this endpoint already exists, i.e was registered before, we throw an error
    if (has(endpointName, this.$[groupName])) {
      throw new Error(`Endpoint ${groupName}.${endpointName} already defined.`);
    }

    // register the endpoint and bind the instance the function call to this class,
    // so the http methods will be available there
    this.$[groupName][endpointName] = instance.call.bind(this);
  }

  private registerEndPoints(endpoints: Endpoint[]) {
    forEach(
      this.addEndpoint,
      endpoints,
    );
  }

  static parseResponseBody(response: Response) {
    const contentType = response.headers.get('Content-Type');

    if (!response.ok) {
      throw new Error(`${response.status.toString()} - ${response.statusText} - ${response.url}`);
    }

    if (contentType && contentType.indexOf('application/json') > -1) {
      return response.json().then(r => camelizeKeys(r));
    }

    return response.text();
  }

  private request<T = any>(
    {
      url,
      method,
      headers,
      body,
    }: RequestInitWithUrl,
    convertBodyToSnakeCase = false,
  ): Promise<T> {
    let payload: any = body;

    if (body && convertBodyToSnakeCase) {
      payload = decamelizeKeys(body);
    }

    return fetch(
      `${this.baseUrl}${url}`,
      {
        method,
        body: payload ? JSON.stringify(payload) : undefined,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
    )
      .then(API.parseResponseBody)
      .then((response) => {
        if (has('error', response)) {
          throw new Error((response as any).error);
        }

        return response as T;
      });
  }

  // HTTP methods
  get = (options: RequestInitWithUrl) => this.request({ method: 'GET', ...options });
  delete = (options: RequestInitWithUrl) => this.request({ method: 'DELETE', ...options });

  post = (options: RequestInitWithUrl, body: any, convertBodyToSnakeCase: boolean) =>
    this.request({ method: 'POST', body, ...options }, convertBodyToSnakeCase);

  put = (options: RequestInitWithUrl, body: any, convertBodyToSnakeCase: boolean) =>
    this.request({ method: 'PUT', body, ...options }, convertBodyToSnakeCase);

  patch = (options: RequestInitWithUrl, body: any, convertBodyToSnakeCase: boolean) =>
    this.request({ method: 'PATCH', body, ...options }, convertBodyToSnakeCase);
}

export default API;
