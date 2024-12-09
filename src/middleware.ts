import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// https://clerk.com/docs/references/nextjs/custom-signup-signin-pages
// https://dashboard.clerk.com/apps/app_2lEkdhPajbtFbhkhajej16VCaRJ/instances/ins_2lEkdcDAkkrtYXtv1k9xrde4ieJ
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhook(.*)', '/api/chatgpt', '/question/:id', '/tags', '/tags/:id', '/profile/:id', '/community', '/jobs'])

export default clerkMiddleware((auth, request) => {
    if (!isPublicRoute(request)) {
        auth().protect()
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
        '/'
    ],
};