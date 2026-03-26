import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  AuthFlowType,
  GetUserCommand,
  DescribeUserPoolClientCommand,
  DescribeUserPoolCommand,
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly userPoolId: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID')!;
    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID')!;

    this.client = new CognitoIdentityProviderClient({ region });
  }

  async signUp(email: string, password: string, name: string) {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
        ],
      });
      return await this.client.send(command);
    } catch (error) {
      this.logger.error(`Cognito signUp error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async confirmSignUp(email: string, code: string) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
      });
      return await this.client.send(command);
    } catch (error) {
      this.logger.error(`Cognito confirmSignUp error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async authenticate(email: string, password: string) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });
      const response = await this.client.send(command);
      return response.AuthenticationResult;
    } catch (error) {
      this.logger.error(`Cognito authenticate error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async forgotPassword(email: string) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });
      return await this.client.send(command);
    } catch (error) {
      this.logger.error(`Cognito forgotPassword error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string,
  ) {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });
      return await this.client.send(command);
    } catch (error) {
      this.logger.error(
        `Cognito confirmForgotPassword error: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async resendConfirmationCode(email: string) {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
      });
      return await this.client.send(command);
    } catch (error) {
      this.logger.error(
        `Cognito resendConfirmationCode error: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async getUserProfile(accessToken: string) {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });
      return await this.client.send(command);
    } catch (error) {
      this.logger.error(`Cognito getUserProfile error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getUserPoolClientDetails(referer: string) {
    const region = this.configService.get<string>('AWS_REGION');
    const clientDetails = await this.client.send(
      new DescribeUserPoolClientCommand({
        ClientId: this.clientId,
        UserPoolId: this.userPoolId,
      }),
    );
    const userPoolDetails = await this.client.send(
      new DescribeUserPoolCommand({
        UserPoolId: this.userPoolId,
      }),
    );
    return {
      userPoolId: clientDetails.UserPoolClient?.UserPoolId,
      userPoolClientId: clientDetails.UserPoolClient?.ClientId,
      loginWith: {
        oauth: {
          domain: `${userPoolDetails.UserPool?.Domain}.auth.${region}.amazoncognito.com`,
          redirectSignIn: clientDetails.UserPoolClient?.CallbackURLs,
          redirectSignOut: clientDetails.UserPoolClient?.LogoutURLs,
          responseType: clientDetails.UserPoolClient?.AllowedOAuthFlows?.[0],
          scopes: clientDetails.UserPoolClient?.AllowedOAuthScopes,
        },
      },
    };
  }
}
