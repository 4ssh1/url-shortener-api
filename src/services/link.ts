import { Link } from '@/models/link';
import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import logger from '@/libs/pino';
import { ILink } from '@/interfaces/link';
import { ILinkDocument } from '@/interfaces/link';
import { ClickLog } from '@/models/click-log';
import { ClickMetaData } from '@/interfaces/click-log';
import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

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

    const link = await Link.findOneAndDelete({ _id: linkId, creator: creatorId });

    if (!link) {
      logger.warn({ linkId, creatorId }, 'Delete failed: Link not found or unauthorized access');
      throw new AppError('Link not found or you do not have permission to delete it.', HttpStatus.NOT_FOUND);
    }

    logger.info({ linkId }, 'Link permanently purged from database');
  }

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

    this.logClickInBackground(link._id.toString(), meta).catch((err) => {
      logger.error({ err, linkId: link._id }, 'Failed to record background click log');
    });

    return link.destination;
  }

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

  public async getLinkAnalytics(linkId: string, creatorId: string) {
    const link = await Link.findOne({ _id: linkId, creator: creatorId });
    if (!link) {
      throw new AppError('Link not found or unauthorized access', HttpStatus.NOT_FOUND);
    }

    // Fetch all logs to get true overall stats
    const logs = await ClickLog.find({ linkId }).sort({ clickedAt: 1 });
    
    const totalClicks = logs.length;
    const uniqueIps = new Set<string>();
    
    const dateMap = new Map<string, number>();
    const countryMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();

    // Node.js native way to convert 'NG' to 'Nigeria', 'US' to 'United States'
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

    logs.forEach(log => {
      // Unique visitors
      if (log.ipAddress) uniqueIps.add(log.ipAddress);

      // Group by Date (YYYY-MM-DD)
      const dateKey = log.clickedAt.toISOString().split('T')[0];
      dateMap.set(dateKey!, (dateMap.get(dateKey!) || 0) + 1);

      // Parse User Agent
      const parser = new UAParser(log.userAgent);
      const browser = parser.getBrowser().name || 'Unknown';
      const deviceType = parser.getDevice().type;
      
      // Default to Desktop if undefined (UAParser leaves desktop type undefined)
      const device = deviceType ? deviceType.charAt(0).toUpperCase() + deviceType.slice(1) : 'Desktop';

      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

      // Resolve Country
      let country = 'Unknown';
      if (log.ipAddress) {
        const geo = geoip.lookup(log.ipAddress);
        if (geo && geo.country) {
          try {
            country = regionNames.of(geo.country) || geo.country;
          } catch (error) {
            country = geo.country;
          }
        }
      }
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    const formatMap = (map: Map<string, number>, keyName: string) => {
      return Array.from(map.entries())
        .map(([key, clicks]) => ({ [keyName]: key, clicks }))
        .sort((a, b) => b.clicks - a.clicks); // Sort highest clicks first
    };

    return {
      link,
      analytics: {
        totalClicks,
        uniqueClicks: uniqueIps.size,
        clicksByDate: formatMap(dateMap, 'date'),
        clicksByCountry: formatMap(countryMap, 'country'),
        clicksByDevice: formatMap(deviceMap, 'device'),
        clicksByBrowser: formatMap(browserMap, 'browser')
      }
    };
  }
}