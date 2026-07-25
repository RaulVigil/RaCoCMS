import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, role: string = 'author') {
    const exists = await this.usersService.findByEmail(email);
    if (exists) throw new UnauthorizedException('El correo ya está registrado');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(email, hash, role as 'admin' | 'editor' | 'author');
    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    return this.generateToken(user);
  }

  private generateToken(user: { id: number; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload), user: { id: user.id, email: user.email, role: user.role } };
  }
}
