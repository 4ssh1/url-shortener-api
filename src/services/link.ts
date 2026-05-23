import { Link } from '@/models/link';
import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';
import { ILink } from '@/interfaces/link';
import { ILinkDocument } from '@/interfaces/link';
import { ClickLog } from '@/models/click-log';
import { ClickMetaData } from '@/interfaces/click-log';

export class LinkService {
  public async createLink(data: ILink): Promise<ILinkDocument> {
    logger.info({ backHalf: data.backHalf, creator: data.creator }, 'Attempting to create a new short link');

    const existingLink = await Link.findOne({ backHalf: data.backHalf! });
    if (existingLink) {
      logger.debug({ backHalf: data.backHalf }, 'Link creation failed: Back-half already exists');
      throw new AppError(
        `The back-half "${data.backHalf}" is already in use. Please try a different custom slug.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const link = new Link(data);
    await link.save();

    logger.info({ linkId: link._id }, 'Short link generated and saved successfully');
    return link;
  }

  public async getLinksByCreator(creatorId: string): Promise<ILinkDocument[]> {
    logger.info({ creatorId }, 'Fetching all links for creator');
    return await Link.find({ creator: creatorId }).sort({ createdAt: -1 });
  }

  public async deleteLink(linkId: string, creatorId: string): Promise<void> {
    logger.info({ linkId, creatorId }, 'Attempting to delete link record');

    // Ensure the link belongs to the person trying to delete it
    const link = await Link.findOneAndDelete({ _id: linkId, creator: creatorId });

    if (!link) {
      logger.warn({ linkId, creatorId }, 'Delete failed: Link not found or unauthorized access');
      throw new AppError('Link not found or you do not have permission to delete it.', HttpStatus.NOT_FOUND);
    }

    logger.info({ linkId }, 'Link permanently purged from database');
  }

  /**
   * Resolves a short link's custom slug, increments its visit counter, and returns the original destination.
   * This is what your redirect router will execute when someone clicks a short link.
   */
  public async accessAndTrackLink(backHalf: string, meta: ClickMetaData): Promise<string> {
    logger.info({ backHalf }, 'Processing redirection access trace');

    const link = await Link.findOneAndUpdate(
      { backHalf },
      { $inc: { totalVisitCount: 1 } },
      { new: true }
    );

    if (!link) {
      logger.debug({ backHalf }, 'Redirection failed: Slug not found');
      throw new AppError('The short link you are trying to reach does not exist.', HttpStatus.NOT_FOUND);
    }

    // FIRE AND FORGET: Kick off the click logging in the background.
    // The server responds to the user immediately.
    this.logClickInBackground(link._id.toString(), meta).catch((err) => {
      logger.error({ err, linkId: link._id }, 'Failed to record background click log');
    });

    return link.destination;
  }

  /**
   * Background worker method to write detailed analytics records
   */
  private async logClickInBackground(linkId: string, meta: ClickMetaData): Promise<void> {
    const log = new ClickLog({
      linkId,
      userAgent: meta.userAgent,
      referer: meta.referer,
      ipAddress: meta.ipAddress,
      clickedAt: new Date()
    });
    await log.save();
  }

  /**
   * Fetches click logs for a specific link to populate charts on the frontend
   */
  public async getLinkAnalytics(linkId: string, creatorId: string) {

    const link = await Link.findOne({ _id: linkId, creator: creatorId });
    if (!link) {
      throw new AppError('Link not found or unauthorized access', HttpStatus.NOT_FOUND);
    }

    // Fetch the last 1000 click events ordered by newest
    const logs = await ClickLog.find({ linkId }).sort({ clickedAt: -1 }).limit(50);
    
    return {
      link,
      analytics: logs
    };
  }

}