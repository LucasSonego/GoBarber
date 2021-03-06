import Notifications from "../schemas/Notification";
import User from "../models/User";

class NotificationController {
  async index(req, res) {
    /**
     *  Verificar se o usuario é um prestador de serviços
     */
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

    /**
     *  Buscar notificações no banco de dados(mongodb)
     */
    var { limit: max } = req.body;
    if (!max) {
      max = 20; // limite de notificações por
    }

    const notifications = await Notifications.find({
      user: req.userId
    })
      .sort({ createdAt: -1 }) // -1 para ordem decrescente
      .limit(max);

    return res.json(notifications);
  }

  async update(req, res) {
    const notification = await Notifications.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    return res.json(notification);
  }
}

export default new NotificationController();
