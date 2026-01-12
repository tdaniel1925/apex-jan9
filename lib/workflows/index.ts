/**
 * Workflows Index
 * Re-exports all event workflow handlers
 *
 * IMPORTANT: These workflows are the ONLY place where business logic
 * should be orchestrated. Never process events without calling the
 * appropriate workflow.
 */

export { onCommissionCreated } from './on-commission-created';
export { onRankChanged } from './on-rank-changed';
export { onAgentRegistered } from './on-agent-registered';

// TODO: Additional workflows to implement
// export { onSubscriptionStarted } from './on-subscription-started';
// export { onPayoutProcessed } from './on-payout-processed';
// export { onPolicyLapsed } from './on-policy-lapsed';
