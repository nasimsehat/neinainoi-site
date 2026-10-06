import { confirm } from '../../lib/signup.js';
export const onRequestGet = ({ request, env }) => confirm(request, env);
