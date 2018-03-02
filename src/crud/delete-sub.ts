import 'source-map-support/register';
import crud from '../util/subscription-crud';
import { default as createApiGatewayHandler, simpleError } from '../util/create-api-gateway-handler';
import logger from '../util/logger';
import * as SNS from 'aws-sdk/clients/sns';

const sns = new SNS();

export const handle = createApiGatewayHandler(
  async ({ pathParameters: { id }, user }) => {

    const subscription = await crud.get(id);

    if (!subscription || subscription.user !== user) {
      return simpleError(
        404,
        'Subscription not found!'
      );
    }

    // remove the sns topic subscription
    await sns.unsubscribe({
      SubscriptionArn: subscription.subscriptionArn
    }).promise();
    logger.info({ subscription }, 'unsubscribed subscription arn');

    // deactivate the subscription
    await crud.deactivate(subscription.id);
    logger.info({ subscription }, `deactivated subscription`);

    return { statusCode: 204 };
  }
);