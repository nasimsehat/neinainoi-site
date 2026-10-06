import { subscribe } from '../../lib/signup.js';
export const onRequestPost = ({ request, env }) => subscribe(request, env);
