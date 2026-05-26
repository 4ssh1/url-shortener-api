import logger from '@/libs/pino';
import crypto from 'crypto';
import { Link } from '@/models/link';
import { GuestLinkInput } from '@/validations/link';
import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import { AnonymousTracker } from '@/models/tracker';
import { GuestLink } from '@/models/guest';

export class AnonymousLinkService {
  public async verifyIpLimit(ipAddress: string): Promise<void> {
    logger.info({ ipAddress }, 'Checking anonymous trial availability for IP');
    
    const record = await AnonymousTracker.findOne({ ipAddress });
    if (record) {
      logger.debug({ ipAddress }, 'Anonymous creation rejected: IP trial already used');
      throw new AppError(
        'You have used your free creation. Please create a free account to shorten more links!',
        HttpStatus.FORBIDDEN
      );
    }
  }

  public async createTrialLink(
    data: GuestLinkInput, 
    ipAddress: string, 
    shortLink: string
  ): Promise<{ backHalf: string; destination: string; shortLink: string }> {
    logger.info({ ipAddress, slug: data.backHalf }, 'Executing anonymous trial link creation');

    try {
      const [existingLink, existingGuestLink] = await Promise.all([
        Link.findOne({ backHalf: data.backHalf! }),
        GuestLink.findOne({ backHalf: data.backHalf! })
      ]);

      if (existingLink || existingGuestLink) {
        throw new AppError(
          `The back-half "${data.backHalf}" is already in use. Please try another custom slug.`,
          HttpStatus.BAD_REQUEST
        );
      }

      const guestLink = await GuestLink.create({
        destination: data.destination,
        backHalf: data.backHalf!,
        shortLink,
        title: 'Guest Link'
      });

      // Track the IP to prevent reuse
      await AnonymousTracker.create({ ipAddress });

      logger.info({ ipAddress, backHalf: data.backHalf }, 'Guest link created and IP locked successfully');
      
      return {
        backHalf: guestLink.backHalf,
        destination: guestLink.destination,
        shortLink: guestLink.shortLink
      };

    } catch (error: any) {
      // Handle duplicate key errors
      if (error.code === 11000) {
        if (error.message.includes('backHalf')) {
          logger.warn('Random slug collision during guest creation. Re-rolling token.');
          const newSlug = crypto.randomBytes(3).toString('hex');
          const newShortLink = shortLink.replace(data.backHalf!, newSlug);
          data.backHalf = newSlug;
          return this.createTrialLink(data, ipAddress, newShortLink);
        }
        if (error.message.includes('ipAddress')) {
          throw new AppError(
            'You have already used your free trial.',
            HttpStatus.FORBIDDEN
          );
        }
      }
      throw error;
    }
  }
}