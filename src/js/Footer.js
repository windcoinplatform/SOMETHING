import React from 'react';



const Footer = ({version}) => {
    return (
        <div className="menu-footer">
            <div>Version 0.1.1</div>
            <div>SOMETHING Team</div>
            <div>
                {socialLinks.map(item =>
                    (<a key={item.id} className={`social ${item.id}`} href={item.url} target="_blank"></a>))}
            </div>
            <div>
                
            </div>
        </div>
    );
}

export default Footer;
