#!/usr/bin/env node

import webPush from 'web-push';

const vapidKeys = webPush.generateVAPIDKeys();

console.log('VAPID Keys Generated:\n');
console.log('Public Key (add to .env.local as VITE_VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key (save securely — needed for Edge Function in Chunk B):');
console.log(vapidKeys.privateKey);
console.log('\n--- .env.local entry ---');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
