import {validate, validateOrReject, Contains, IsInt, Length, IsEmail, IsFQDN, IsDate, Min, Max} from "class-validator";

export class Config {
    @Length(10, 20)
    title: string;

    @Contains("hello")
    text: string;
}