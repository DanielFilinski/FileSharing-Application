import styled from "styled-components";
import { tokens } from "@fluentui/react-theme";
import { Title3 } from "@fluentui/react-components";

type CardTitleProps = {
    text: string;
}

export const CardTitle = ({ text }: CardTitleProps) => {
    return (
        <Title3>{text}</Title3>
    )
}
