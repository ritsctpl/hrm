import React from 'react';
import logo from '@/images/FENTA-LOGO-F.png';

const UserInstructions: React.FC = () => {
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

    return (
        <div style={style.manual} className="manual-content">
            <div style={style.header}>
                <h1 style={style.title}>API Configuration Maintenance Screen User Manual</h1>
                <img src={logo.src} alt="logo" style={style.logo} />
            </div>

            <div style={style.section}>
                <h2 style={style.sectionTitle}>1. Introduction</h2>
                <table style={style.table}>
                    <tbody>
                        <tr>
                            <td style={style.td}><strong>Purpose:</strong></td>
                            <td style={style.td}>To guide users on how to configure and manage API endpoints, including stored procedures and their parameters.</td>
                        </tr>
                        <tr>
                            <td style={style.td}><strong>Target Users:</strong></td>
                            <td style={style.td}>System administrators, developers, and API managers.</td>
                        </tr>
                        <tr>
                            <td style={style.td}><strong>Module Name:</strong></td>
                            <td style={style.td}>API Configuration Maintenance</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={style.section}>
                <h2 style={style.sectionTitle}>2. System Access</h2>
                <table style={style.table}>
                    <thead>
                        <tr>
                            <th style={style.th}>Item</th>
                            <th style={style.th}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={style.td}>URL/Application Path</td>
                            <td style={style.td}>https://yourdomain.com/api-configuration</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Login Requirement</td>
                            <td style={style.td}>Username & Password</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Access Roles</td>
                            <td style={style.td}>System administrators and API managers</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={style.section}>
                <h2 style={style.sectionTitle}>3. Navigation Path</h2>
                <p>Main Menu → API Configuration → Maintenance</p>
            </div>

            <div style={style.section}>
                <h2 style={style.sectionTitle}>4. Screen Overview</h2>
                <table style={style.table}>
                    <thead>
                        <tr>
                            <th style={style.th}>Section</th>
                            <th style={style.th}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={style.td}>Header</td>
                            <td style={style.td}>Search functionality and instruction button</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Configuration Table</td>
                            <td style={style.td}>Lists API configurations (columns include API Name, Stored Procedure, HTTP Method, etc.)</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Action Buttons</td>
                            <td style={style.td}>+ Add New, Edit, Delete, Copy</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Form Panel</td>
                            <td style={style.td}>Form fields for creating/editing API configurations</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={style.section}>
                <h2 style={style.sectionTitle}>5. Step-by-Step Instructions</h2>

                <div style={style.section}>
                    <h3 style={style.subTitle}>5.1. Add New API Configuration</h3>
                    <ol style={style.list}>
                        <li style={style.listItem}>Click "+ Add New" button</li>
                        <li style={style.listItem}>Fill in the following fields:
                            <ul style={style.list}>
                                <li>API Name (Required)</li>
                                <li>Stored Procedure (Required)</li>
                                <li>HTTP Method (Required)</li>
                                <li>Input Parameters</li>
                                <li>Output Structure</li>
                            </ul>
                        </li>
                        <li style={style.listItem}>Click "Create" to save</li>
                    </ol>
                </div>

                <div style={style.section}>
                    <h3 style={style.subTitle}>5.2. Edit Existing Configuration</h3>
                    <ol style={style.list}>
                        <li style={style.listItem}>Select a configuration from the table</li>
                        <li style={style.listItem}>Modify the necessary fields</li>
                        <li style={style.listItem}>Click "Update" to save changes</li>
                    </ol>
                </div>

                <div style={style.section}>
                    <h3 style={style.subTitle}>5.3. Delete a Configuration</h3>
                    <ol style={style.list}>
                        <li style={style.listItem}>Select the configuration to delete</li>
                        <li style={style.listItem}>Click "Delete" button</li>
                        <li style={style.listItem}>Confirm the deletion in the popup</li>
                    </ol>
                </div>

                <div style={style.section}>
                    <h3 style={style.subTitle}>5.4. Copy a Configuration</h3>
                    <ol style={style.list}>
                        <li style={style.listItem}>Select the configuration to copy</li>
                        <li style={style.listItem}>Click "Copy" button</li>
                        <li style={style.listItem}>Modify the API Name and other fields as needed</li>
                        <li style={style.listItem}>Click "Copy" to create the new configuration</li>
                    </ol>
                </div>
            </div>

            <div style={style.section}>
                <h2 style={style.sectionTitle}>6. Field Definitions</h2>
                <table style={style.table}>
                    <thead>
                        <tr>
                            <th style={style.th}>Field Name</th>
                            <th style={style.th}>Description</th>
                            <th style={style.th}>Required</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={style.td}>API Name</td>
                            <td style={style.td}>Unique identifier for the API endpoint</td>
                            <td style={style.td}>Yes</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Stored Procedure</td>
                            <td style={style.td}>Name of the database stored procedure</td>
                            <td style={style.td}>Yes</td>
                        </tr>
                        <tr>
                            <td style={style.td}>HTTP Method</td>
                            <td style={style.td}>HTTP method for the API (GET, POST, PUT, DELETE)</td>
                            <td style={style.td}>Yes</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Input Parameters</td>
                            <td style={style.td}>JSON structure of input parameters</td>
                            <td style={style.td}>No</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Output Structure</td>
                            <td style={style.td}>JSON structure of expected output</td>
                            <td style={style.td}>No</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style={style.section}>
                <h2 style={style.sectionTitle}>7. FAQs / Troubleshooting</h2>
                <table style={style.table}>
                    <thead>
                        <tr>
                            <th style={style.th}>Issue</th>
                            <th style={style.th}>Solution</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={style.td}>Cannot save configuration</td>
                            <td style={style.td}>Check required fields and ensure API Name is unique</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Invalid stored procedure name</td>
                            <td style={style.td}>Verify the stored procedure exists in the database</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Configuration not showing in list</td>
                            <td style={style.td}>Use search functionality or check filters</td>
                        </tr>
                        <tr>
                            <td style={style.td}>Cannot edit configuration</td>
                            <td style={style.td}>Ensure you have proper permissions</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserInstructions;
