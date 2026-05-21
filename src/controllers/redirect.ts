import { Request, Response, Router } from "express";
import { LinkService } from "@/services/link";
import { catchAsync } from "@/util/catch-async";
import { HttpStatus } from "@/consts/http-status";
import { ClickMetaData } from "@/interfaces/click-log";

export class RedirectController {
  private static linkService = new LinkService();

  public static handleRedirect = catchAsync(async (req: Request, res: Response) => {
    const { backHalf } = req.params;

    const meta = {
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'] || req.headers['referrer'] as string,
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    
    // 1. Service finds the link, bumps totalVisitCount atomically, returns long URL
    const destinationUrl = await RedirectController.linkService.accessAndTrackLink(backHalf as string, meta as ClickMetaData);
    
    return res.redirect(HttpStatus.MOVED_PERMANENTLY, destinationUrl);
  });
}
