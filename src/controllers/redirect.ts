import { Request, Response, Router } from "express";
import { LinkService } from "@/services/link";
import { catchAsync } from "@/util/catch-async";
import { HttpStatus } from "@/consts/http-status";

export class RedirectController {
  private static linkService = new LinkService();

  public static handleRedirect = catchAsync(async (req: Request, res: Response) => {
    const { backHalf } = req.params;
    
    // 1. Service finds the link, bumps totalVisitCount atomically, returns long URL
    const destinationUrl = await RedirectController.linkService.accessAndTrackLink(backHalf as string);
    
    return res.redirect(HttpStatus.MOVED_PERMANENTLY, destinationUrl);
  });
}
