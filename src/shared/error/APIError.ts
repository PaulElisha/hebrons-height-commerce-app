/** @format */
import ErrorCode from "../enum/error-code.ts";
import HttpStatus from "../enum/http.ts";
import BadRequestException from "./bad-request.ts";
import InternalServerError from "./internal-server.ts";
import NotFoundException from "./not-found.ts";
import UnauthorizedExceptionError from "./unauthorized.ts";

export function notFound(message = "Resource not found") {
 return new NotFoundException(
  message,
  HttpStatus.NOT_FOUND,
  ErrorCode.RESOURCE_NOT_FOUND,
 );
}

export function badRequest(message: string) {
 return new BadRequestException(
  message,
  HttpStatus.UNPROCESSABLE_ENTITY,
  ErrorCode.VALIDATION_ERROR,
 );
}

export function internalServer(message: string) {
 return new InternalServerError(
  message,
  HttpStatus.INTERNAL_SERVER_ERROR,
  ErrorCode.INTERNAL_SERVER_ERROR,
 );
}

export function unauthorized(message = "Unauthorized, Please sign in") {
 return new UnauthorizedExceptionError(
  message,
  HttpStatus.UNAUTHORIZED,
  ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
 );
}

export function forbidden(message = "Forbidden") {
 return new UnauthorizedExceptionError(
  message,
  HttpStatus.FORBIDDEN,
  ErrorCode.ACCESS_UNAUTHORIZED,
 );
}
