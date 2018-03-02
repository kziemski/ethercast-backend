import 'source-map-support/register';
import createApiGatewayHandler, { BAD_REQUEST } from '../util/create-api-gateway-handler';
import { SUBSCRIPTION_NOT_FOUND } from './get-sub';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import SubscriptionCrud from '../util/subscription-crud';

const crud = new SubscriptionCrud({ client: new DynamoDB.DocumentClient() });

export const handle = createApiGatewayHandler(
  async ({ pathParameters: { id }, user }) => {
    if (!id) {
      return BAD_REQUEST;
    }

    const subscription = await crud.get(id);

    if (!subscription || subscription.user !== user) {
      return SUBSCRIPTION_NOT_FOUND;
    }

    const receipts = await crud.listReceipts(subscription.id);

    return {
      statusCode: 200,
      body: receipts
    };
  }
);