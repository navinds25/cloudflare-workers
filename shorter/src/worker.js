/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { nanoid } from 'nanoid/async'

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const { pathname } = url;

		const setUrlPair = (shortUrl, longUrl) => env.shorter.put(shortUrl, longUrl, {expirationTtl: 86400});
		const getLongUrl = (shortUrl) => env.shorter.get(shortUrl);
		async function verifyCredentials(user, pass) {
			const basicUser = await env.shorter_config.get("shorterBasicUser");
			const basicPass = await env.shorter_config.get("shorterBasicPass");
			if (basicUser !== user) {
				throw new UnauthorizedException("Invalid credentials.");
			}

			if (basicPass !== pass) {
				throw new UnauthorizedException("Invalid credentials.");
			}
		}
		async function basicAuthentication(request) {
			const Authorization = request.headers.get("Authorization");

			const [scheme, encoded] = Authorization.split(" ");

			// The Authorization header must start with Basic, followed by a space.
			if (!encoded || scheme !== "Basic") {
				throw new BadRequestException("Malformed authorization header.");
			}

			// Decodes the base64 value and performs unicode normalization.
			// @see https://datatracker.ietf.org/doc/html/rfc7613#section-3.3.2 (and #section-4.2.2)
			// @see https://dev.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
			const buffer = Uint8Array.from(atob(encoded), (character) =>
				character.charCodeAt(0)
			);
			const decoded = new TextDecoder().decode(buffer).normalize();

			// The username & password are split by the first colon.
			//=> example: "username:password"
			const index = decoded.indexOf(":");

			// The user & password are split by the first colon and MUST NOT contain control characters.
			// @see https://tools.ietf.org/html/rfc5234#appendix-B.1 (=> "CTL = %x00-1F / %x7F")
			if (index === -1 || /[\0-\x1F\x7F]/.test(decoded)) {
				throw new BadRequestException("Invalid authorization value.");
			}

			return {
				user: decoded.substring(0, index),
				pass: decoded.substring(index + 1),
			};
		}
		async function genShortUrl() {
			//const randUrlstring = Math.random().toString(36).substr(2, 5);
      const randUrlstring = await nanoid();
			const rootDomain = await env.shorter_config.get('rootDomain');
			return `https://${rootDomain}/${randUrlstring}`
		}
		if (request.method == "GET") {
			const longUrl = await getLongUrl(request.url)
			if (longUrl != null) {
				const destination = longUrl;
				const statusCode = 302;
				return Response.redirect(destination, statusCode);
			} else {
				return new Response('hello world');
			}
		} else if (request.method == "POST" && pathname == "/pair") {
			const { user, pass } = await basicAuthentication(request);
			await verifyCredentials(user, pass);
			const postPayload = await request.json();
			await setUrlPair(postPayload.shortUrl, postPayload.longUrl);
			return new Response(JSON.stringify(postPayload));
		} else if (request.method == "POST" && pathname == "/gen") {
			const { user, pass } = await basicAuthentication(request);
			await verifyCredentials(user, pass);
			const postPayload = await request.json();
			const shortUrl = await genShortUrl();
			await setUrlPair(shortUrl, postPayload.longUrl);
			return new Response(JSON.stringify({ "shortUrl": shortUrl, "longurl": postPayload.longUrl }));
		} else {
			console.log(pathname);
			return new Response('Method not allowed: 405\n');
		}
	},
};
