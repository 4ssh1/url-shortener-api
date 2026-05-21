import { Response, Request } from 'express';
import { catchAsync } from '@/util/catch-async';
import { validateOrThrow } from '@/util/validate-or-throw';
import { ApiResponse } from '@/util/api-response';
import { LinkService } from '@/services/link';
import { createLinkSchema } from '@/validations/link';
import { AppError } from '@/util/app-eror';
import { HttpStatus } from '@/consts/http-status';

export class LinkController {
  private static linkService = new LinkService();

  public static create = catchAsync(async (req: Request, res: Response) => {

    if (!req.user?._id) {
      throw new AppError('Authentication context missing', HttpStatus.UNAUTHORIZED);
    }

    // 2. Inject the authenticated user's ID into the request body before running Zod validation
    // This allows your existing createLinkSchema to validate the 'creator' field seamlessly
    req.body.creator = req.user._id;

    const validatedData = validateOrThrow(createLinkSchema, req.body);

    const newLink = await LinkController.linkService.createLink({
      title: validatedData.body.title,
      destination: validatedData.body.destination,
      shortLink: validatedData.body.shortLink,
      creator: validatedData.body.creator,
      backHalf: validatedData.body.backHalf,
    });

    return ApiResponse.created(res, newLink, 'Short link generated successfully');
  });

  public static getMyLinks = catchAsync(async (req: Request, res: Response) => {
    if (!req.user?._id) {
      throw new AppError('Authentication context missing', HttpStatus.UNAUTHORIZED);
    }

    const links = await LinkController.linkService.getLinksByCreator(req.user._id);
    return ApiResponse.success(res, links, 'Your short links retrieved successfully');
  });

  public static remove = catchAsync(async (req: Request, res: Response) => {
    const { id: linkId } = req.params;
    if (!linkId) {
      throw new AppError('Link ID parameter is required', HttpStatus.BAD_REQUEST);
    }

    if (!req.user?._id) {
      throw new AppError('Authentication context missing', HttpStatus.UNAUTHORIZED);
    }

    await LinkController.linkService.deleteLink(linkId as string, req.user._id);

    return ApiResponse.success(res, null, 'Short link deleted successfully');
  });

  public static getAnalytics = catchAsync(async (req: Request, res: Response) => {
    const { id: linkId } = req.params;
    if (!linkId) throw new AppError('Link ID parameter is required', HttpStatus.BAD_REQUEST);
    if (!req.user?._id) throw new AppError('Authentication context missing', HttpStatus.UNAUTHORIZED);

    const stats = await LinkController.linkService.getLinkAnalytics(linkId as string, req.user._id);
    return ApiResponse.success(res, stats, 'Link analytics compiled successfully');
  });
}