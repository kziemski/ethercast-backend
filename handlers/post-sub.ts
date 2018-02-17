import { APIGatewayEvent, Callback, Context, Handler } from 'aws-lambda';
import { crud, Subscription } from './subscription-crud';

export const handle: Handler = async (event: APIGatewayEvent, context: Context, cb?: Callback) => {
  if (!cb) {
    throw new Error('invalid caller');
  }

  const { requestContext: { authorizer: { user } } } = event as any;
  const { body } = event;

  if (!body) {
    cb(new Error('no body'));
    return;
  }

  if (!user) {
    cb(new Error('no user'));
    return;
  }

  let sub: Subscription;

  try {
    console.log('attempting to parse subscription');
    sub = JSON.parse(body);
  } catch (error) {
    cb(error);
    return;
  }

  console.log('creating subscription', sub);

  const saved = await crud.create(sub, user);

  cb(
    null,
    {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(saved)
    }
  );
};
