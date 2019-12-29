import jwt, { JsonWebTokenError } from "jsonwebtoken";
import * as yup from "yup";

import User from "../models/User";
import authConfig from "../../config/auth";

class SessionController {
  async store(req, res) {
    /**
     *  Validar dados da requisição
     */
    const schema = yup.object().shape({
      email: yup
        .string()
        .email()
        .required(),
      password: yup.string().required()
    });

    if (!schema.isValid()) {
      return res.status(400).json({
        error: "Usuario ou senha não foram inseridos"
      });
    }

    /**
     *  Verificar se o usuario e senha estão corretos
     */
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({
        error: "Usuário ou senha inválidos"
      });
    }

    const { id, nome } = user;

    /**
     *  Retornar o token e algumas informações uteis
     */
    return res.json({
      user: {
        id,
        nome,
        email
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn
      })
    });
  }
}

export default new SessionController();
