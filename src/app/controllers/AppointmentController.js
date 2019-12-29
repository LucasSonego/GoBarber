import Appointments from "../models/Appointments";
import User from "../models/User";
import File from "../models/File";
import * as yup from "yup";
import { startOfHour, parseISO, isBefore, format } from "date-fns";
import pt from "date-fns/locale/pt";
import Notifcation from "../schemas/Notification";

class AppointmentController {
  async store(req, res) {
    const schema = yup.object().shape({
      date: yup.date().required(),
      provider_id: yup.number().required()
    });

    if (!schema.isValid()) {
      return res.status(400).json({
        error: "Forneça todos os dados necessarios"
      });
    }

    const { provider_id, date } = req.body;

    /**
     *  Verificar se o provider_id passado é realmente um provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true }
    });

    if (!isProvider) {
      return res.status(401).json({
        error: "Não há nenhum provider com esste id"
      });
    }

    /**
     *  Verificar se o cliente se trata de um viajante do tempo
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({
        error: "Ainda não temos suporte a viagens no tempo"
      });
    }

    /**
     *  Verificar disponibilidade do horario agendado
     */
    const indisponivel = await Appointments.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    });

    if (indisponivel) {
      return res.status(400).json({
        error: "Horario de agendamento indisponivel"
      });
    }

    const agendamento = await Appointments.create({
      user_id: req.userId,
      provider_id,
      date
    });

    /**
     *  Notificar prestador de serviço
     */

    const user = await User.findByPk(req.userId);
    const dataFormatada = format(hourStart, "dd 'de' MMMM', as' H:mm'h'", {
      locale: pt
    });

    await Notifcation.create({
      content: `Novo agendamento de ${user.nome} para dia ${dataFormatada}`,
      user: provider_id
    });

    return res.json(agendamento);
  }

  async index(req, res) {
    const { page = 1 } = req.query;

    const { pageSize = 10 } = req.body;

    const appointments = await Appointments.findAndCountAll({
      where: {
        user_id: req.userId,
        canceled_at: null
      },
      order: ["date"],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      attributes: ["id", "date"],
      include: [
        {
          model: User,
          as: "provider",
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

export default new AppointmentController();
