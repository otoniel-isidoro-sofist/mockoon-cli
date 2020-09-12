import { Environment } from '../types/environment.type';
import { Header, Route, RouteResponse } from '../types/route.type';
import { v1 as uuid } from 'uuid';

export const Migrations: {
  id: number;
  migrationFunction: (environment: Environment) => void;
}[] = [
  // v0.4.0beta
  {
    id: 1,
    migrationFunction: (environment: Environment) => {
      // proxy settings
      if (!environment.proxyMode) {
        environment.proxyMode = false;
      }
      if (!environment.proxyHost) {
        environment.proxyHost = '';
      }
      if (!environment.https) {
        environment.https = false;
      }
    }
  },

  // 1.0.0
  {
    id: 2,
    migrationFunction: (environment: Environment) => {
      if (!environment.cors) {
        environment.cors = true;
      }

      environment.routes.forEach((route) => {
        // add uuid
        if (!route.uuid) {
          route.uuid = uuid();
        }

        if (route['customHeaders']) {
          // find content type header
          const ContentTypeHeader = route['customHeaders'].find(
            (customHeader) => customHeader.key === 'Content-Type'
          );

          // add custom header only if no content type
          if (!ContentTypeHeader) {
            route['customHeaders'].unshift({
              uuid: uuid(),
              key: 'Content-Type',
              value: route['contentType']
            });
          }

          // delete old content type
          delete route['contentType'];
        }
      });
    }
  },

  // 1.2.0
  {
    id: 3,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route) => {
        // add missing uuid
        if (!route.uuid) {
          route.uuid = uuid();
        }
      });
    }
  },

  // 1.3.0
  {
    id: 4,
    migrationFunction: (environment: Environment) => {
      // add new headers property to environments
      if (!environment.headers) {
        (environment.headers as any) = [{ uuid: uuid(), key: '', value: '' }];
      }

      environment.routes.forEach((route: Route & { file: any }) => {
        // add missing sendAsBody
        if (route.file && route.file.sendAsBody === undefined) {
          route.file.sendAsBody = false;
        }

        // add missing documentation
        if (route.documentation === undefined) {
          route.documentation = '';
        }

        // rename customHeaders to headers
        if (route['customHeaders']) {
          route['headers'] = route['customHeaders'];
          delete route['customHeaders'];
        }
      });
    }
  },

  // 1.4.0
  {
    id: 5,
    migrationFunction: (environment: Environment) => {
      delete environment['duplicates'];

      environment.routes.forEach((route: Route & { file: any }) => {
        // remove file object
        route['filePath'] = route.file ? route.file.path : '';
        route['sendFileAsBody'] = route.file ? route.file.sendAsBody : false;
        delete route.file;

        delete route['duplicates'];
      });
    }
  },

  /**
   * Multiple route responses:
   * Create a responses object in each route and migrate the old route properties in the new route response
   */
  {
    id: 6,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach(
        (
          route: Route & {
            body?: string;
            statusCode?: string;
            headers?: Header[];
            latency?: number;
            filePath?: string;
            sendFileAsBody?: boolean;
          }
        ) => {
          route.responses = [];
          route.responses.push(<RouteResponse & { statusCode: string }>{
            uuid: uuid(),
            statusCode: route.statusCode,
            label: '',
            latency: route.latency,
            filePath: route.filePath,
            sendFileAsBody: route.sendFileAsBody,
            headers: route.headers,
            body: route.body,
            rules: []
          });

          delete route.statusCode;
          delete route.latency;
          delete route.filePath;
          delete route.sendFileAsBody;
          delete route.headers;
          delete route.body;
        }
      );
    }
  },

  /**
   * Renew route responses UUID to ensure no uuid were duplicated after v1.5.0
   */
  {
    id: 7,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          routeResponse.uuid = uuid();
        });
      });
    }
  },

  /**
   * Create a "enabled" param
   */
  {
    id: 8,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.enabled = true;
      });
    }
  },

  /**
   * Add route response label
   */
  {
    id: 9,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (!routeResponse.label) {
            routeResponse.label = '';
          }
        });
      });
    }
  },

  /**
   * Add proxy request/response headers
   */
  {
    id: 10,
    migrationFunction: (environment: Environment) => {
      // add new proxy request/response headers property to environments
      if (!environment.proxyReqHeaders) {
        environment.proxyReqHeaders = [{ key: '', value: '' }];
      }
      if (!environment.proxyResHeaders) {
        environment.proxyResHeaders = [{ key: '', value: '' }];
      }
    }
  },

  /**
   * Add route response's disableTemplating option.
   * Convert statusCode to number
   */
  {
    id: 11,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (routeResponse.disableTemplating === undefined) {
            routeResponse.disableTemplating = false;
          }

          routeResponse.statusCode = parseInt(
            (routeResponse.statusCode as unknown) as string,
            10
          );
        });
      });
    }
  },

  /**
   * Add route response rulesOperator
   */
  {
    id: 12,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (routeResponse.rulesOperator === undefined) {
            routeResponse.rulesOperator = 'OR';
          }
        });
      });
    }
  }
];

export const HighestMigrationId = Migrations[Migrations.length - 1].id;
