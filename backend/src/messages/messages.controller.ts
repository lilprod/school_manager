import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { MessagesService } from './messages.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user, dto);
  }

  @Get('inbox')
  findInbox(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.findInbox(user.id);
  }

  @Get('sent')
  findSent(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.findSent(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.unreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messagesService.markAsRead(user.id, id);
  }
}
