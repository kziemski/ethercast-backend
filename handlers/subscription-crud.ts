import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import uuid = require('uuid');

const { SUBSCRIPTIONS_TABLE } = process.env;
const USER_INDEX = 'ByUser';

interface Condition {
  type: 'address' | 'topic0' | 'topic1' | 'topic2' | 'topic3';
  value: string; // hex value of the type
}

enum Status {
  active = 'active',
  deactivated = 'deactivated'
}

export interface Subscription {
  id: string; // uuid v4
  user: string;
  name: string; // reasonable max length
  status: Status;
  description?: string; // reasonable max length - longer

  // Conditions in the top-level array are AND-ed, conditions in nested arrays are OR-ed
  logic: Array<Array<Condition>>;
}

type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T];
type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

const client = new DocumentClient();

export default class SubscriptionCrud {
  async create(subscription: Omit<Subscription, 'id' | 'user' | 'status'>, user: string): Promise<Subscription> {
    console.log('creating subscription', subscription);

    const id = uuid.v4();

    const result = await client.put({
      TableName: SUBSCRIPTIONS_TABLE,
      Item: {
        ...subscription,
        id,
        user,
        status: Status.active
      }
    }).promise();

    return this.get(id);
  }

  async get(id: string, ConsistentRead: boolean = true): Promise<Subscription> {
    console.log('getting subscription with ID', id);

    const { Item } = await client.get({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: {
        id
      },
      ConsistentRead
    }).promise();

    return Item as Subscription;
  }

  async deactivate(id: string): Promise<Subscription> {
    console.log('DEACTIVATING subscription with ID', id);

    const sub = await this.get(id);

    await client.put({
      TableName: SUBSCRIPTIONS_TABLE,
      Item: {
        ...sub,
        status: Status.deactivated
      }
    }).promise();

    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    console.log('DELETING subscription with ID', id);

    await client.delete({
      TableName: SUBSCRIPTIONS_TABLE,
      Key: {
        id
      }
    }).promise();
  }

  async list(user: string): Promise<Subscription[]> {
    console.log('listing subscriptions for user', user);

    const { Items } = await client.query({
      TableName: SUBSCRIPTIONS_TABLE,
      IndexName: USER_INDEX,
      KeyConditionExpression: '#user = :user',
      ExpressionAttributeValues: {
        ':user': user
      },
      ExpressionAttributeNames: {
        '#user': 'user'
      }
    }).promise();

    return Items as Subscription[];
  }
}

export const crud = new SubscriptionCrud();
