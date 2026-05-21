import { Link } from '@/models/link';
import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';
import { CreateLinkInput } from '@/validations/link';
import { ILinkDocument } from '@/interfaces/link';

export class LinkService {
  public async createLink(data: CreateLinkInput): Promise<ILinkDocument> {
    logger.info({ backHalf: data.backHalf, creator: data.creator }, 'Attempting to create a new short link');

    const existingLink = await Link.findOne({ backHalf: data.backHalf });
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

  /**
   * Resolves a short link's custom slug, increments its visit counter, and returns the original destination.
   * This is what your redirect router will execute when someone clicks a short link.
   */
  public async accessAndTrackLink(backHalf: string): Promise<string> {
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

    return link.destination;
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
}