import { Body1, Card, Radio, Subtitle2 } from "@fluentui/react-components";

import { IconTitleContainer, TextRowsContainer } from "@/app/styles/layouts";
import AccentIcon from "@/components/accent-icon";
import { Zap } from "lucide-react";
import styled from "styled-components";
import { COLORS } from "@/app/theme/color-pallete";

type SelectedSectionProps = {
    title: string;
    value: string;
    description: string;
    isSelected: boolean;
}

export const SelectedSection = ({ title, value, description, isSelected }: SelectedSectionProps) => { 
    return (
        <SelectedSectionContainer isSelected={isSelected}>            
            <Radio value={value} checked={isSelected}/>
            <TextRowsContainer>
                <Subtitle2>{title}</Subtitle2>
                <Body1>{description}</Body1>
            </TextRowsContainer>     
        </SelectedSectionContainer>
    )
}

const SelectedSectionContainer = styled.div<{isSelected: boolean}>`
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 16px;
    background-color: ${props => props.isSelected ? COLORS.purple3 : COLORS.gray1};
    border-radius: 20px;
    padding: 16px;
    border: 2px solid ${props => props.isSelected ? COLORS.purple2 : COLORS.gray4};

`;