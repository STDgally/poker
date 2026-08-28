-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('CASH', 'TOURNAMENT') NOT NULL DEFAULT 'CASH',
    `smallBlind` INTEGER NOT NULL,
    `bigBlind` INTEGER NOT NULL,
    `buyIn` INTEGER NOT NULL,
    `startStack` INTEGER NOT NULL,
    `endStack` INTEGER NULL,
    `handsPlayed` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HandHistory` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `handNumber` INTEGER NOT NULL,
    `dealerSeat` INTEGER NOT NULL,
    `heroSeat` INTEGER NOT NULL,
    `heroPosition` VARCHAR(191) NOT NULL,
    `heroCards` VARCHAR(191) NOT NULL,
    `board` VARCHAR(191) NOT NULL,
    `potSize` INTEGER NOT NULL,
    `heroNetResult` INTEGER NOT NULL,
    `vpip` BOOLEAN NOT NULL DEFAULT false,
    `pfr` BOOLEAN NOT NULL DEFAULT false,
    `wentToShowdown` BOOLEAN NOT NULL DEFAULT false,
    `wonHand` BOOLEAN NOT NULL DEFAULT false,
    `playedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HandHistory_sessionId_idx`(`sessionId`),
    INDEX `HandHistory_userId_idx`(`userId`),
    INDEX `HandHistory_playedAt_idx`(`playedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionLog` (
    `id` VARCHAR(191) NOT NULL,
    `handHistoryId` VARCHAR(191) NOT NULL,
    `street` ENUM('PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN') NOT NULL,
    `seat` INTEGER NOT NULL,
    `actorType` ENUM('HUMAN', 'BOT') NOT NULL,
    `actorName` VARCHAR(191) NOT NULL,
    `action` ENUM('POST_SB', 'POST_BB', 'FOLD', 'CHECK', 'CALL', 'BET', 'RAISE', 'ALL_IN') NOT NULL,
    `amount` INTEGER NOT NULL DEFAULT 0,
    `potAfter` INTEGER NOT NULL,
    `sequence` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActionLog_handHistoryId_idx`(`handHistoryId`),
    INDEX `ActionLog_handHistoryId_sequence_idx`(`handHistoryId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HandHistory` ADD CONSTRAINT `HandHistory_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HandHistory` ADD CONSTRAINT `HandHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionLog` ADD CONSTRAINT `ActionLog_handHistoryId_fkey` FOREIGN KEY (`handHistoryId`) REFERENCES `HandHistory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
