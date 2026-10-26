import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import type { SendMessageDto } from './dto/send-message.dto.js';

const senderSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(sender: AuthenticatedUser, dto: SendMessageDto) {
    await this.assertCanMessage(sender, dto.recipientId);

    return this.prisma.message.create({
      data: {
        senderId: sender.id,
        recipientId: dto.recipientId,
        content: dto.content,
      },
      include: { sender: { select: senderSelect }, recipient: { select: senderSelect } },
    });
  }

  async findInbox(userId: string) {
    return this.prisma.message.findMany({
      where: { recipientId: userId },
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSent(userId: string) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      include: { recipient: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message introuvable.');
    }
    if (message.recipientId !== userId) {
      throw new ForbiddenException('Vous ne pouvez marquer comme lu que vos propres messages reçus.');
    }
    if (message.readAt) {
      return message;
    }
    return this.prisma.message.update({ where: { id: messageId }, data: { readAt: new Date() } });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.message.count({ where: { recipientId: userId, readAt: null } });
    return { count };
  }

  /**
   * Un ADMIN/TEACHER/STUDENT ne peut écrire qu'à quelqu'un de sa propre école.
   * Un PARENT peut écrire à n'importe quel enseignant/admin/élève de l'une des
   * écoles où il a un enfant inscrit (lien ParentStudent), et réciproquement.
   * Deux PARENT peuvent s'écrire s'ils partagent un enfant en commun.
   */
  private async assertCanMessage(sender: AuthenticatedUser, recipientId: string): Promise<User> {
    const recipient = await this.prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      throw new NotFoundException('Destinataire introuvable.');
    }

    if (sender.role !== 'PARENT' && recipient.role !== 'PARENT') {
      if (sender.schoolId && recipient.schoolId && sender.schoolId === recipient.schoolId) {
        return recipient;
      }
      throw new ForbiddenException('Vous ne pouvez écrire qu\'à un membre de votre école.');
    }

    if (sender.role === 'PARENT' && recipient.role === 'PARENT') {
      const shareChild = await this.parentsShareChild(sender.id, recipient.id);
      if (shareChild) {
        return recipient;
      }
      throw new ForbiddenException('Vous ne pouvez écrire qu\'à un parent avec lequel vous partagez un enfant.');
    }

    if (sender.role === 'PARENT') {
      const allowed = await this.parentHasChildInSchool(sender.id, recipient.schoolId);
      if (allowed) {
        return recipient;
      }
      throw new ForbiddenException('Vous ne pouvez écrire qu\'aux membres des écoles de vos enfants.');
    }

    // recipient.role === 'PARENT'
    const allowed = await this.parentHasChildInSchool(recipient.id, sender.schoolId);
    if (allowed) {
      return recipient;
    }
    throw new ForbiddenException('Ce parent n\'a pas d\'enfant dans votre école.');
  }

  private async parentHasChildInSchool(parentUserId: string, schoolId: string | null): Promise<boolean> {
    if (!schoolId) {
      return false;
    }
    const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId: parentUserId } });
    if (!parentProfile) {
      return false;
    }
    const link = await this.prisma.parentStudent.findFirst({
      where: { parentId: parentProfile.id, student: { user: { schoolId } } },
    });
    return Boolean(link);
  }

  private async parentsShareChild(parentUserIdA: string, parentUserIdB: string): Promise<boolean> {
    const [parentA, parentB] = await Promise.all([
      this.prisma.parentProfile.findUnique({ where: { userId: parentUserIdA } }),
      this.prisma.parentProfile.findUnique({ where: { userId: parentUserIdB } }),
    ]);
    if (!parentA || !parentB) {
      return false;
    }
    const link = await this.prisma.parentStudent.findFirst({
      where: {
        parentId: parentA.id,
        student: { guardians: { some: { parentId: parentB.id } } },
      },
    });
    return Boolean(link);
  }
}
