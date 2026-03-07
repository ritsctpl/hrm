import React from 'react';
import logo from '@/images/FENTA-LOGO-F.png';

const UserInstructions: React.FC<{ manualContent?: any[] }> = ({ manualContent }) => {
    const style = {
        manual: {
            fontFamily: 'Arial, sans-serif',
            maxWidth: '900px',
            // margin: '40px auto',
            padding: '20px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#000',
            backgroundColor: '#fff'
        },
        header: {
            borderBottom: '2px solid #000',
            marginBottom: '30px',
            paddingBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold' as const,
            margin: '0 0 5px 0'
        },
        section: {
            marginBottom: '25px'
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: 'bold' as const,
            marginBottom: '15px',
            borderBottom: '1px solid #000',
            paddingBottom: '5px'
        },
        subTitle: {
            fontSize: '14px',
            fontWeight: 'bold' as const,
            marginBottom: '10px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
            marginBottom: '20px',
            border: '1px solid #000'
        },
        th: {
            border: '1px solid #000',
            padding: '8px',
            textAlign: 'left' as const,
            fontWeight: 'bold' as const,
            backgroundColor: '#fff'
        },
        td: {
            border: '1px solid #000',
            padding: '8px',
            verticalAlign: 'top' as const
        },
        list: {
            marginLeft: '20px',
            marginBottom: '15px'
        },
        listItem: {
            marginBottom: '5px'
        },
        required: {
            marginLeft: '5px'
        },
        logo: {
            width: '100px',
            height: '50px'
        }
    };

    const renderContent = (content: any) => {
        switch (content.type) {
            case 'table':
                return (
                    <table style={style.table}>
                        {content.data.headers ? (
                            <thead>
                                <tr>
                                    {content.data.headers.map((header: string, index: number) => (
                                        <th key={index} style={style.th}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                        ) : null}
                        <tbody>
                            {content.data.rows.map((row: any, index: number) => (
                                <tr key={index}>
                                    {content.data.headers ? (
                                        content.data.headers.map((header: string, colIndex: number) => (
                                            <td key={colIndex} style={style.td}>{row[header]}</td>
                                        ))
                                    ) : (
                                        <>
                                            <td style={style.td}><strong>{row.label}</strong></td>
                                            <td style={style.td}>{row.value}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'text':
                return <p>{content.data}</p>;
            case 'steps':
                return (
                    <ol style={style.list}>
                        {content.data.map((step: any, index: number) => (
                            <li key={index} style={style.listItem}>
                                {typeof step === 'string' ? step : (
                                    <>
                                        {step.text}
                                        {step.subSteps && (
                                            <ul style={style.list}>
                                                {step.subSteps.map((subStep: string, subIndex: number) => (
                                                    <li key={subIndex} style={style.listItem}>{subStep}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                    </ol>
                );
            default:
                return null;
        }
    };

    return (
        <div style={style.manual} className="manual-content">
            <div style={style.header}>
                <h1 style={style.title}>{manualContent[0].title}</h1>
                <img src={logo.src} alt="logo" style={style.logo} />
            </div>

            {manualContent[0].sections.map((section, index) => (
                <div key={index} style={style.section}>
                    <h2 style={style.sectionTitle}>{section.title}</h2>
                    {section.content && renderContent(section.content)}
                    {section.subsections?.map((subsection, subIndex) => (
                        <div key={subIndex} style={style.section}>
                            <h3 style={style.subTitle}>{subsection.title}</h3>
                            {renderContent(subsection.content)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default UserInstructions;
