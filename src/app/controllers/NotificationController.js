import Notifications from "../schemas/Notification";
import User from "../models/User";

class NotificationController {
  async index(req, res) {
    const provider = await User.findOne({
      where: {
        id: req.userId,
        provider: true
      }
    });

    if (!provider) {
      return res.status(401).json({
        error: "Este usuario não é um prestador de serviços"
      });
    }

    var { limit: max } = req.body;
    if (!max) {
      max = 20;
    }

    const notifications = await Notifications.find({
      user: req.userId
    })
      .sort({ createdAt: -1 }) // -1 para ordem decrescente
      .limit(max);

    return res.json(notifications);
  }
}

export default new NotificationController();
