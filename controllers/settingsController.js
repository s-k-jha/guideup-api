const Setting = require('../models/Setting');
const settingsService = require('../services/settingsService');
const llmService = require('../services/llmService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * GET /api/admin/settings
 * protect (admin)
 */
const getAdminSettings = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    return successResponse(res, {
      aiChatEnabled: settings.aiChatEnabled,
      aiChatEnabledAt: settings.aiChatEnabledAt,
      aiChatEnabledBy: settings.aiChatEnabledBy,
      aiConfigured: llmService.isConfigured(),
      aiProvider: llmService.getActiveProvider(),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PATCH /api/admin/settings
 * protect (admin)
 * Body: { aiChatEnabled: boolean }
 */
const updateAdminSettings = async (req, res) => {
  try {
    const { aiChatEnabled } = req.body;
    if (typeof aiChatEnabled !== 'boolean') {
      return errorResponse(res, 'aiChatEnabled must be a boolean', 400);
    }

    if (aiChatEnabled && !llmService.isConfigured()) {
      return errorResponse(
        res,
        'Configure ANTHROPIC_API_KEY or OPENAI_API_KEY on the server before enabling AI chat.',
        400
      );
    }

    const update = { aiChatEnabled };
    if (aiChatEnabled) {
      update.aiChatEnabledAt = new Date();
      update.aiChatEnabledBy = req.admin.id;
    }

    const settings = await Setting.findOneAndUpdate({ singleton: 'singleton' }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return successResponse(
      res,
      {
        aiChatEnabled: settings.aiChatEnabled,
        aiChatEnabledAt: settings.aiChatEnabledAt,
        aiChatEnabledBy: settings.aiChatEnabledBy,
        aiConfigured: llmService.isConfigured(),
        aiProvider: llmService.getActiveProvider(),
      },
      aiChatEnabled ? 'AI chat enabled' : 'AI chat disabled'
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getAdminSettings, updateAdminSettings };
