-- CreateTable
CREATE TABLE `BlackjackSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `numDecks` INTEGER NOT NULL,
    `dealerHitsSoft17` BOOLEAN NOT NULL,
    `blackjackPayout` DOUBLE NOT NULL,
    `minBet` INTEGER NOT NULL,
    `maxBet` INTEGER NOT NULL,
    `startStack` INTEGER NOT NULL,
    `endStack` INTEGER NULL,
    `roundsPlayed` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `BlackjackSession_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlackjackRound` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roundNumber` INTEGER NOT NULL,
    `dealerCards` VARCHAR(191) NOT NULL,
    `dealerTotal` INTEGER NOT NULL,
    `playedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BlackjackRound_sessionId_idx`(`sessionId`),
    INDEX `BlackjackRound_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlackjackBoxResult` (
    `id` VARCHAR(191) NOT NULL,
    `roundId` VARCHAR(191) NOT NULL,
    `isHero` BOOLEAN NOT NULL,
    `actorName` VARCHAR(191) NOT NULL,
    `seat` INTEGER NOT NULL,
    `boxIndex` INTEGER NOT NULL,
    `cards` VARCHAR(191) NOT NULL,
    `finalTotal` INTEGER NOT NULL,
    `bet` INTEGER NOT NULL,
    `insuranceBet` INTEGER NOT NULL DEFAULT 0,
    `isDoubled` BOOLEAN NOT NULL DEFAULT false,
    `isFromSplit` BOOLEAN NOT NULL DEFAULT false,
    `isBlackjack` BOOLEAN NOT NULL DEFAULT false,
    `isBust` BOOLEAN NOT NULL DEFAULT false,
    `isSurrendered` BOOLEAN NOT NULL DEFAULT false,
    `result` ENUM('WIN', 'LOSE', 'PUSH', 'BLACKJACK', 'SURRENDER') NOT NULL,
    `payout` INTEGER NOT NULL,

    INDEX `BlackjackBoxResult_roundId_idx`(`roundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlackjackActionLog` (
    `id` VARCHAR(191) NOT NULL,
    `roundId` VARCHAR(191) NOT NULL,
    `seat` INTEGER NOT NULL,
    `boxIndex` INTEGER NOT NULL,
    `sequence` INTEGER NOT NULL,
    `action` ENUM('HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER', 'INSURANCE_TAKEN', 'INSURANCE_DECLINED') NOT NULL,
    `handTotalBefore` INTEGER NOT NULL,
    `dealerUpCard` VARCHAR(191) NOT NULL,
    `wasOptimal` BOOLEAN NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BlackjackActionLog_roundId_idx`(`roundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BlackjackSession` ADD CONSTRAINT `BlackjackSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlackjackRound` ADD CONSTRAINT `BlackjackRound_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `BlackjackSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlackjackRound` ADD CONSTRAINT `BlackjackRound_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlackjackBoxResult` ADD CONSTRAINT `BlackjackBoxResult_roundId_fkey` FOREIGN KEY (`roundId`) REFERENCES `BlackjackRound`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlackjackActionLog` ADD CONSTRAINT `BlackjackActionLog_roundId_fkey` FOREIGN KEY (`roundId`) REFERENCES `BlackjackRound`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
