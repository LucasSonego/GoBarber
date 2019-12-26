import Appointments from "../models/Appointments";
import User from "../models/User";
import * as yup from "yup";
import { startOfHour, parseISO, isBefore } from "date-fns";

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

    return res.json(agendamento);
  }
}

export default new AppointmentController();
