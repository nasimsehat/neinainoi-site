import { unsubscribe } from '../../lib/signup.js';
export const onRequestGet = ({ request, env }) => unsubscribe(request, env);
export const onRequestPost = ({ request, env }) => unsubscribe(request, env);
