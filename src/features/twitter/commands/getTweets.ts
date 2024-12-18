import { Command } from '../../../terminal/types/commands';
import { getTweets } from '../../../twitter/functions/getTweets';

/**
 * @command get-tweets
 * @description Get recent tweets from a specified user
 */
export const twitterGetTweets: Command = {
  name: 'get-tweets',
  description: 'Get recent tweets from a specified user. Do not include the @ symbol.',
  parameters: [
    {
      name: 'username',
      description: 'Twitter username (without @ symbol)',
      required: true,
      type: 'string'
    },
    {
      name: 'limit',
      description: 'Maximum number of tweets to fetch',
      required: false,
      type: 'number',
      defaultValue: '20'
    }
  ],
  handler: async (args) => {
    try {
      const result = await getTweets(args.username, args.limit);
      const formattedResult = result.join('\n');
      return {
        output: formattedResult.startsWith('Error') ? `❌ ${formattedResult}` : `📝 ${formattedResult}`
      };
    } catch (error) {
      return {
        output: `❌ Error fetching tweets: ${error}`
      };
    }
  }
}; 