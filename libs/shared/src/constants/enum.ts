import z from 'zod/v4';

export const QueueEnum = z.enum([
  'email',
//   'subscription',   
]);

export const SubscriptionJobEnum = z.enum([
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
]);