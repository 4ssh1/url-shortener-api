import { Request, Response } from 'express';
import { catchAsync } from '@/util/catch-async';
import { validateOrThrow } from '@/util/validate-or-throw';
import { ApiResponse } from '@/util/api-response';
import { guestLinkSchema } from '@/validations/link';
import crypto from 'crypto';
import { AnonymousLinkService } from '@/services/guest';

export class AnonymousLinkController {
  private static anonymousService = new AnonymousLinkService();

  public static createTrial = catchAsync(async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';

    await AnonymousLinkController.anonymousService.verifyIpLimit(clientIp);

    const validatedData = validateOrThrow(guestLinkSchema, req.body);

    const slug = validatedData.backHalf || crypto.randomBytes(3).toString('hex');
    const shortUrl = `${req.protocol}://${req.get('host')}/api/v1/${slug}`;

    const guestLink = await AnonymousLinkController.anonymousService.createTrialLink(
      { ...validatedData, backHalf: slug },
      clientIp,
      shortUrl
    );

    return ApiResponse.created(
      res, 
      { 
        details: {
          destination: guestLink.destination,
          backHalf: guestLink.backHalf,
          shortLink: guestLink.shortLink,
          title: 'Guest Link',
          expiresIn: '5 days'
        }, 
        shortUrl: guestLink.shortLink 
      }, 
      'Your free trial link was generated successfully! This link will expire in 5 days.'
    );
  });
}