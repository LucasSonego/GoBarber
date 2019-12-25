import * as yup from "yup";
import User from "../models/User";

class UserController {
  async store(req, res) {
    const schema = yup.object().shape({
      nome: yup.string().required(),
      email: yup.string().required(),
      password: yup
        .string()
        .required()
        .min(6)
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({
        error: "Preencha todos os campos obrigatorios"
      });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      return res.status(400).json({
        error: "Este email já está sendo utilizado por um usuário cadastrado."
      });
    }

    const { id, nome, email, provider } = await User.create(req.body);
    return res.json({
      id,
      nome,
      email,
      provider
    });
  }

  async update(req, res) {
    const schema = yup.object().shape({
      nome: yup.string(),
      email: yup.string(),
      password: yup.string().min(6),
      oldPassword: yup
        .string()
        .min(6)
        .when("password", (password, field) =>
          password ? field.required() : field
        ),
      confirmPassword: yup
        .string()
        .when("password", (password, field) =>
          password ? field.required().oneOf([yup.ref("password")]) : field
        )
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({
        error: "Preencha todos os campos corretamente"
      });
    }

    const { email, oldPassword } = req.body;
    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({
          error: "Este email já está sendo utilizado por um usuário cadastrado."
        });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({
        error: "Senha antiga incorreta"
      });
    }

    const { id, nome, provider } = await user.update(req.body);

    return res.json({
      id,
      nome,
      email,
      provider
    });
  }
}

export default new UserController();
