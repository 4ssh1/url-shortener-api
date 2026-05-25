import { Request, Response } from 'express';
import { catchAsync } from '@/util/catch-async';
import { Link } from '@/models/link';
import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';
import { GuestLink } from '@/models/guest';

export class RedirectController {
  public static handleRedirect = catchAsync(async (req: Request, res: Response) => {
    const backHalf = req.params.backHalf!;

    // Check guest links first (they're temporary)
    const guestLink = await GuestLink.findOne({ backHalf });
    if (guestLink) {
      return res.redirect(guestLink.destination);
    }

    // Then check registered user links
    const link = await Link.findOne({ backHalf });
    if (!link) {
      throw new AppError(
        'Link not found or has expired',
        HttpStatus.NOT_FOUND
      );
    }

    return res.redirect(link.destination);
  });
}