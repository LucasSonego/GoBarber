import * as yup from "yup";
import { startOfHour, parseISO, isBefore, format, subHours } from "date-fns";
import pt from "date-fns/locale/pt";

import Appointments from "../models/Appointments";
import User from "../models/User";
import File from "../models/File";
import Notifcation from "../schemas/Notification";
import Mail from "../../lib/Mail";

class AppointmentController {
  async store(req, res) {
    /**
     *  Validação dos dados recebidos
     */
    const schema = yup.object().shape({
      date: yup.date().required(),
      provider_id: yup.number().required()
    });

    if (!schema.isValid()) {
      return res.status(400).json({
        error: "Forneça todos os dados necessarios"
      });
    }

    /**
     *  Verificar se o provider_id passado é realmente um provider
     */
    const { provider_id } = req.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true }
    });

    if (!isProvider) {
      return res.status(401).json({
        error: "Não há nenhum provider com esste id"
      });
    }

    /**
     *  Verificar se o usuario esta contratando a si mesmo
     */
    if (provider_id === req.userId) {
      return res.status(401).json({
        error: "Não é permitido que um usuario contrate a si mesmo"
      });
    }

    /**
     *  Verificar se o cliente se trata de um viajante do tempo
     */
    const { date } = req.body;

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

    // Adicionar agendamento ao banco de dados(postgres)
    const agendamento = await Appointments.create({
      user_id: req.userId,
      provider_id,
      date
    });

    // Adicionar notificação ao banco de dados(mongodb)
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
      limit: pageSize, //paginação
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

  async delete(req, res) {
    const appointment = await Appointments.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["nome", "email"]
        }
      ]
    });

    /**
     *  Verificar se o agendamento pertence ao usuario que fez a requisição
     */
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "Você não tem permissão para cancelar este agendamento"
      });
    }

    /**
     *  Verificar se o agendamento já foi cancelado anteriormente
     */
    if (appointment.canceled_at) {
      return res.json(appointment);
    }

    /**
     *  Verificar se o cancelamento esta sendo feito com ao menos 2 horas de antecedencia
     */
    if (isBefore(subHours(parseISO(appointment.date), 2), new Date())) {
      return res.status(401).json({
        error:
          "O cancelamento de um agendamento deve ser feito com" +
          " ao menos 2 horas de antecedencia"
      });
    }

    appointment.canceled_at = new Date();

    await Mail.sendMail({
      to: `${appointment.provider.nome} <${appointment.provider.email}>`,
      subject: "Agendamento cancelado",
      text: `Um agendamento para ${appointment.date} foi cancelado.`
    });

    await appointment.save();

    return res.json(appointment);
  }
}

export default new AppointmentController();
