export interface SwaggerDocProps {
  spec: object;
}

export interface SwaggerSpec {
  swagger?: string;
  info?: Info;
  externalDocs?: ExternalDocs;
  host?: string;
  basePath?: string;
  schemes?: string[];
  consumes?: string[];
  produces?: string[];
  paths?: {
    [pathName: string]: Path;
  };
  definitions?: {
    [definitionsName: string]: Schema;
  };
  parameters?: {
    [parameterName: string]: BodyParameter | QueryParameter;
  };
  responses?: {
    [responseName: string]: Response;
  };
  security?: {
    [securityDefinitionName: string]: string[];
  }[];
  securityDefinitions?: {
    [securityDefinitionName: string]: Security;
  };
  tags?: Tag[];
}
