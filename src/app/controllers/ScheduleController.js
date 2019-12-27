import Appointments from "../models/Appointments";
import User from "../models/User";
import File from "../models/File";

class ScheduleController {
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

    const { page = 1 } = req.query;

    const { pageSize = 10 } = req.body;

    const appointments = await Appointments.findAndCountAll({
      where: {
        provider_id: req.userId,
        canceled_at: null
      },
      order: ["date"],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      attributes: ["id", "date"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nome"],
          include: [
            {
              model: File,
              as: "avatar",
              attributes: ["id", "path", "url"]
            }
          ]
        }
      ]
    });

    return res.json(appointments);
  }
}

export default new ScheduleController();
