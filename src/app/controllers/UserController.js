import * as yup from "yup";
import User from "../models/User";

class UserController {
  async store(req, res) {
    /**
     *  Validar os dados da requisição
     */
    const schema = yup.object().shape({
      nome: yup.string().required(),
      email: yup
        .string()
        .email()
        .required(),
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

    /**
     *  Verificar se já existe um usuario com o email informado
     */
    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      return res.status(400).json({
        error: "Este email já está sendo utilizado por um usuário cadastrado."
      });
    }

    /**
     *  Criar um novo User e enviar algumas informações uteis na resposta
     */
    const { id, nome, email, provider } = await User.create(req.body);
    return res.json({
      id,
      nome,
      email,
      provider
    });
  }

  async update(req, res) {
    /**
     *  Validar os dados da requisição
     */
    const schema = yup.object().shape({
      nome: yup.string(),
      email: yup.string().email(),
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

    //buscar dados do usuario
    const user = await User.findByPk(req.userId);
    let { email, oldPassword } = req.body;

    //verificar se um novo email foi passado na requsição
    if (email) {
      if (email !== user.email) {
        //verificar se não ha nenhum outro usuario com este email
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
          return res.status(400).json({
            error:
              "Este email já está sendo utilizado por um usuário cadastrado."
          });
        }
      }
    } else {
      email = user.email;
    }

    //verificar se foi passada uma senha antiga e se esta correta
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({
        error: "Senha antiga incorreta"
      });
    }

    //atualizar o usuario no banco de dados e retornar informaçoes uteis
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
