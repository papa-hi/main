import { emailQueue } from './server/email-queue.js';

async function addUnityToEmailQueue() {
  console.log('Adding Unity to email queue for reliable delivery...');
  
  // Add Unity (user ID 66) to the email queue
  await emailQueue.addToQueue(66, 'unityeasta212@gmail.com', 'Unity', 'google_uYSlF1h2');
  
  console.log('Unity added to email queue successfully');
  
  // Check queue status
  const status = emailQueue.getQueueStatus();
  console.log('Email queue status:', status);
}

addUnityToEmailQueue();